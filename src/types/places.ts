import type { Icon } from 'react-bootstrap-icons';
import {
  Balloon,
  CapsulePill,
  Cart3,
  Film,
  Hospital,
  Mask,
  Mortarboard,
  PersonArmsUp,
  TrainFreightFront,
  TrainFront,
  TrainLightrailFront,
  Tree,
} from 'react-bootstrap-icons';

// same order as the backend sends them
export type PlaceCategory =
  | 'SUPERMARKET'
  | 'PHARMACY'
  | 'PARK'
  | 'PLAYGROUND'
  | 'METRO'
  | 'TRAM'
  | 'TRAIN'
  | 'KINDERGARTEN'
  | 'SCHOOL'
  | 'HOSPITAL'
  | 'CINEMA'
  | 'THEATRE';

// straight-line distance; for a park, to its edge
export interface NearbyPlace {
  category: PlaceCategory;
  name: string | null;
  distanceInMeters: number;
  latitude: number;
  longitude: number;
}

export const PLACE_CATEGORY_META: Record<PlaceCategory, { label: string; icon: Icon }> = {
  SUPERMARKET: { label: 'Supermarket', icon: Cart3 },
  PHARMACY: { label: 'Pharmacy', icon: CapsulePill },
  PARK: { label: 'Park', icon: Tree },
  PLAYGROUND: { label: 'Playground', icon: PersonArmsUp },
  METRO: { label: 'Metro', icon: TrainFront },
  TRAM: { label: 'Tram stop', icon: TrainLightrailFront },
  TRAIN: { label: 'Train station', icon: TrainFreightFront },
  KINDERGARTEN: { label: 'Kindergarten', icon: Balloon },
  SCHOOL: { label: 'School', icon: Mortarboard },
  HOSPITAL: { label: 'Hospital', icon: Hospital },
  CINEMA: { label: 'Cinema', icon: Film },
  THEATRE: { label: 'Theatre', icon: Mask },
};
