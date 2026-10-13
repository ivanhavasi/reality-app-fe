import { Link } from 'react-router-dom';
import { ArrowRight, BarChartLine, Bell, Building, Gear, HouseDoor, Inbox, Tree } from 'react-bootstrap-icons';
import type { Icon } from 'react-bootstrap-icons';
import { useUser } from '../context/UserContext';
import { PageHeader } from '../components/ui';

interface Props {
  token: string;
}

const links: { to: string; title: string; text: string; icon: Icon }[] = [
  { to: '/real-estates', title: 'Apartments', text: 'For sale and rent across Prague', icon: Building },
  { to: '/real-estates?building=HOUSE', title: 'Houses', text: 'Houses for sale in the Prague region', icon: HouseDoor },
  { to: '/real-estates?building=LAND', title: 'Building plots', text: 'Land for sale in the Prague region', icon: Tree },
  { to: '/stats', title: 'Market stats', text: 'Price per m² and supply over time', icon: BarChartLine },
  { to: '/notifications', title: 'Alerts', text: 'Get notified when new listings match', icon: Bell },
  { to: '/sent-notifications', title: 'Matches', text: 'Listings your alerts have sent you', icon: Inbox },
  { to: '/settings', title: 'Settings', text: 'Account details and appearance', icon: Gear },
];

const Dashboard = (_props: Props) => {
  const { user, isAdmin } = useUser();

  return (
    <>
      <PageHeader
        title={user ? `Welcome back, ${user.username}` : 'Welcome back'}
        subtitle={isAdmin ? 'Signed in with admin access' : 'Pick up where you left off'}
      />

      <div className="link-grid">
        {links.map(({ to, title, text, icon: LinkIcon }) => (
          <Link key={to} to={to} className="link-card">
            <span className="link-card-icon">
              <LinkIcon size={16} />
            </span>
            <span>
              <span className="link-card-title d-block">{title}</span>
              <span className="link-card-text d-block">{text}</span>
            </span>
            <ArrowRight size={15} className="link-card-arrow align-self-center" />
          </Link>
        ))}
      </div>
    </>
  );
};

export default Dashboard;
