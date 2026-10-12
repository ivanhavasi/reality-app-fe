import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spinner, Table } from 'react-bootstrap';
import { ClockHistory, GeoAlt, PinMap, PlayFill } from 'react-bootstrap-icons';
import type { Icon } from 'react-bootstrap-icons';
import { EmptyState, PageHeader, Segmented } from '../components/ui';
import { useError } from '../context/ErrorContext';
import { getAdminJobs, startCoordinatesBackfillJob, startPlacesImportJob, startScrapeJob } from '../services/AdminJobService';
import { AdminJob, AdminJobStatus, isActiveJob } from '../types/admin';
import { BUILDING_TYPE_META, BuildingType, TransactionType } from '../types/property';

const POLL_INTERVAL_MS = 2000;
const PLACE_CATEGORY_COUNT = 12;

// the backend scrapes houses too, even though the listings UI doesn't show them yet
const BUILDING_OPTIONS = (['APARTMENT', 'HOUSE', 'LAND'] as BuildingType[]).map(type => ({
  value: type,
  label: BUILDING_TYPE_META[type].plural,
}));

const TRANSACTION_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'SALE', label: 'Buy' },
  { value: 'RENT', label: 'Rent' },
];

const JOB_LABELS: Record<AdminJob['type'], string> = {
  SCRAPE: 'Scrape',
  BACKFILL_COORDINATES: 'Coordinates',
  IMPORT_PLACES: 'Places',
};

type StartJob = (building: BuildingType, transaction: TransactionType) => Promise<unknown>;

interface JobPanelProps {
  title: string;
  description: string;
  actionLabel: string;
  icon: Icon;
  disabled: boolean;
  // the places import covers all of Prague, not one kind of listing
  forListings?: boolean;
  onStart: (building: BuildingType, transaction: TransactionType) => Promise<void>;
}

const JobPanel: React.FC<JobPanelProps> = ({ title, description, actionLabel, icon: ActionIcon, disabled, forListings = true, onStart }) => {
  const [building, setBuilding] = useState<BuildingType>('APARTMENT');
  const [transaction, setTransaction] = useState<TransactionType>('SALE');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart(building, transaction);
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="panel d-flex flex-column">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-subtitle mb-3">{description}</p>
      {forListings && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Segmented size="sm" ariaLabel="Property type" value={building} onChange={setBuilding} options={BUILDING_OPTIONS} />
          <Segmented size="sm" ariaLabel="Transaction" value={transaction} onChange={setTransaction} options={TRANSACTION_OPTIONS} />
        </div>
      )}
      <div className="mt-auto">
        <Button variant="primary" disabled={disabled || starting} onClick={handleStart}>
          {starting ? <Spinner animation="border" size="sm" className="text-reset" /> : <ActionIcon size={14} />}
          {actionLabel}
        </Button>
      </div>
    </section>
  );
};

const StatusChip: React.FC<{ status: AdminJobStatus }> = ({ status }) => {
  switch (status) {
    case 'WAITING':
      return <span className="chip"><Spinner animation="border" size="sm" />Waiting</span>;
    case 'RUNNING':
      return <span className="chip chip-accent"><Spinner animation="border" size="sm" />Running</span>;
    case 'SUCCEEDED':
      return <span className="chip chip-positive">Done</span>;
    default:
      return <span className="chip chip-negative">Failed</span>;
  }
};

const formatStarted = (value: string) => {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (job: AdminJob, now: number) => {
  if (!job.startedAt) return '—';
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : now;
  const seconds = Math.max(0, Math.round((end - new Date(job.startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds} s`;
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};

const describeResult = (job: AdminJob) => {
  const count = (value: number) => value.toLocaleString('cs-CZ');
  if (job.status === 'FAILED') return job.error ?? 'Failed';
  if (job.status === 'WAITING') return 'Starts when the scheduled scrape finishes';
  if (job.type === 'IMPORT_PLACES') {
    const imported = `${count(job.placesImported)} places in ${job.placeCategoriesImported} of ${PLACE_CATEGORY_COUNT} categories`;
    return job.status === 'RUNNING' ? `Downloading: ${imported}` : imported;
  }
  if (job.type === 'SCRAPE') {
    return job.status === 'RUNNING' ? 'Reading portals…' : `${count(job.savedListings)} listings saved`;
  }
  const fromPortals = `${count(job.coordinatesFilled)} from portals (${count(job.pagesScanned)} pages)`;
  if (job.addressesToLocate === 0) {
    return job.status === 'RUNNING' ? `Re-reading portals: ${fromPortals}` : `${fromPortals} · no addresses left to locate`;
  }
  const fromAddresses = `${count(job.addressesLocated)} located by address (${count(job.addressesChecked)} of ${count(job.addressesToLocate)} checked)`;
  return `${fromPortals} · ${fromAddresses}`;
};

const Admin: React.FC = () => {
  const { setError } = useError();
  const [jobs, setJobs] = useState<AdminJob[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const active = jobs?.some(isActiveJob) ?? false;

  // polling failures stay quiet, otherwise a flaky connection would raise a toast every two seconds
  const loadJobs = useCallback(async (quiet = false) => {
    try {
      setJobs(await getAdminJobs());
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setJobs(previous => previous ?? []);
    }
  }, [setError]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      loadJobs(true);
      setNow(Date.now());
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, loadJobs]);

  const start = (startJob: StartJob) => async (building: BuildingType, transaction: TransactionType) => {
    try {
      await startJob(building, transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the job');
    }
    setNow(Date.now());
    await loadJobs();
  };

  return (
    <>
      <PageHeader
        title="Data jobs"
        subtitle="Run portal scrapes and maintenance on demand. Jobs keep running on the server after you leave this page."
      />

      <div className="job-grid">
        <JobPanel
          title="Scrape now"
          description="Reads the newest pages of every portal, saves new listings and sends alerts, the same as the scheduled run."
          actionLabel="Run scrape"
          icon={PlayFill}
          disabled={active}
          onStart={start(startScrapeJob)}
        />
        <JobPanel
          title="Fill in coordinates"
          description="Re-reads every page of Sreality and Bezrealitky for exact coordinates, then locates the remaining listings (iDNES, removed listings) from their street via OpenStreetMap. Saves nothing new and sends no alerts. Addresses are looked up one per second, so the first run can take a while."
          actionLabel="Start backfill"
          icon={GeoAlt}
          disabled={active}
          onStart={start(startCoordinatesBackfillJob)}
        />
        <JobPanel
          title="Nearby places"
          description="Downloads supermarkets, pharmacies, parks, playgrounds, public transport, schools, hospitals, cinemas and theatres in Prague from OpenStreetMap for the listing detail. Runs by itself on the 1st of every month; takes a few minutes, longer when the server is busy."
          actionLabel="Import places"
          icon={PinMap}
          disabled={active}
          forListings={false}
          onStart={start(() => startPlacesImportJob())}
        />
      </div>
      {active && <p className="form-text mt-2 mb-0">One job runs at a time, so the buttons unlock when this one finishes.</p>}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Recent jobs</h2>
        </div>

        {jobs === null ? (
          <div className="loading-block" style={{ minHeight: 120 }}>
            <Spinner animation="border" size="sm" role="status" />
            Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={ClockHistory}
            title="No jobs yet"
            text="Jobs you start here are listed until the server restarts."
          />
        ) : (
          <div className="surface overflow-hidden">
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Listings</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th className="text-end">Duration</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="fw-semibold text-nowrap">{JOB_LABELS[job.type]}</td>
                      <td className="text-nowrap">
                        {job.buildingType && job.transactionType
                          ? `${BUILDING_TYPE_META[job.buildingType].plural} · ${job.transactionType === 'SALE' ? 'Buy' : 'Rent'}`
                          : 'All of Prague'}
                      </td>
                      <td><StatusChip status={job.status} /></td>
                      <td className="text-nowrap tabular text-2">{formatStarted(job.startedAt ?? job.createdAt)}</td>
                      <td className="text-end text-nowrap tabular text-2">{formatDuration(job, now)}</td>
                      <td className={job.status === 'FAILED' ? 'text-negative' : 'text-2'}>{describeResult(job)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Admin;
