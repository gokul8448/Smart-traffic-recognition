export type SignType = 
  | 'SPEED_LIMIT'
  | 'STOP'
  | 'YIELD'
  | 'PEDESTRIAN_CROSSING'
  | 'SCHOOL_ZONE'
  | 'NO_U_TURN'
  | 'CONSTRUCTION'
  | 'SLIPPERY_ROAD'
  | 'SHARP_CURVE'
  | 'TRAFFIC_LIGHT';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface TrafficSign {
  id: string;
  type: SignType;
  name: string;
  value?: number; // e.g., 25, 45, 65
  confidence: number; // 0.0 - 1.0
  distanceAhead: number; // in meters
  actionRequired: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'Regulatory' | 'Warning' | 'Guide' | 'Work Zone';
  description: string;
  box?: {
    x: number; // percentage 0-100
    y: number;
    width: number;
    height: number;
  };
}

export interface HazardAlert {
  id: string;
  timestamp: string;
  type: 'SPEED_VIOLATION' | 'COLLISION_WARNING' | 'PEDESTRIAN_HAZARD' | 'STOP_SIGN_FAILURE' | 'WEATHER_HAZARD' | 'WORK_ZONE' | 'LANE_DEPARTURE';
  title: string;
  message: string;
  severity: AlertSeverity;
  currentSpeed: number;
  speedLimit: number;
  deltaMph?: number;
  dismissed?: boolean;
  autoBraked?: boolean;
  location?: string;
  iconName?: string;
}

export interface VehicleTelemetry {
  speed: number; // current speed in mph
  speedLimit: number; // current recognized speed limit
  targetSpeed: number; // cruise target
  rpm: number;
  gear: string;
  throttle: number; // 0-100%
  brake: number; // 0-100%
  cruiseControl: boolean;
  laneOffset: number; // -1 to 1 (left to right deviation)
  followingDistance: number; // meters
  timeToCollision: number; // seconds
  safetyScore: number; // 0 - 100
  totalViolations: number;
  odometer: number; // miles
  roadCondition: 'Dry Asphalt' | 'Wet/Rain' | 'Night Road' | 'Foggy' | 'Construction Zone';
  isAutoBraking: boolean;
  driverAlertness: 'Optimal' | 'Attentive' | 'Drowsy / Distracted';
}

export interface RoadScenario {
  id: string;
  name: string;
  environment: 'highway' | 'school_zone' | 'urban_downtown' | 'mountain_pass' | 'construction_zone';
  defaultSpeed: number;
  postedLimit: number;
  signs: TrafficSign[];
  weather: 'clear' | 'rain' | 'night' | 'fog';
  roadCondition: 'Dry Asphalt' | 'Wet/Rain' | 'Night Road' | 'Foggy' | 'Construction Zone';
  hazardDescription: string;
}
