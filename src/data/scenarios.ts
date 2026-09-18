import { RoadScenario } from '../types';

export const ROAD_SCENARIOS: RoadScenario[] = [
  {
    id: 'school_zone',
    name: 'Suburban School District',
    environment: 'school_zone',
    defaultSpeed: 28,
    postedLimit: 20,
    weather: 'clear',
    roadCondition: 'Dry Asphalt',
    hazardDescription: 'Crosswalk active, children crossing alert, speed buffer exceeded',
    signs: [
      {
        id: 'sz-sign-1',
        type: 'SCHOOL_ZONE',
        name: 'School Zone 20 MPH When Flashing',
        value: 20,
        confidence: 0.98,
        distanceAhead: 42,
        actionRequired: 'REDUCE_TO_20',
        urgency: 'high',
        category: 'Regulatory',
        description: 'Mandatory 20 mph speed zone active during school hours',
        box: { x: 74, y: 22, width: 14, height: 18 }
      },
      {
        id: 'sz-sign-2',
        type: 'PEDESTRIAN_CROSSING',
        name: 'Pedestrian Crosswalk Ahead',
        confidence: 0.95,
        distanceAhead: 78,
        actionRequired: 'SCAN_CROSSWALK',
        urgency: 'medium',
        category: 'Warning',
        description: 'Yield to pedestrians in marked crosswalk',
        box: { x: 18, y: 32, width: 12, height: 16 }
      }
    ]
  },
  {
    id: 'expressway',
    name: 'Interstate Interstate 80',
    environment: 'highway',
    defaultSpeed: 74,
    postedLimit: 65,
    weather: 'clear',
    roadCondition: 'Dry Asphalt',
    hazardDescription: 'High-speed corridor, vehicle ahead braking, speed violation by 9 mph',
    signs: [
      {
        id: 'hw-sign-1',
        type: 'SPEED_LIMIT',
        name: 'Speed Limit 65 MPH',
        value: 65,
        confidence: 0.99,
        distanceAhead: 110,
        actionRequired: 'CRUISE_CONTROL_ADJUST',
        urgency: 'medium',
        category: 'Regulatory',
        description: 'Freeway statutory maximum speed limit',
        box: { x: 80, y: 24, width: 13, height: 17 }
      }
    ]
  },
  {
    id: 'downtown',
    name: 'Metropolitan Downtown',
    environment: 'urban_downtown',
    defaultSpeed: 34,
    postedLimit: 25,
    weather: 'clear',
    roadCondition: 'Dry Asphalt',
    hazardDescription: 'Blind intersection, mandatory stop sign ahead, cyclist in right corridor',
    signs: [
      {
        id: 'dt-sign-1',
        type: 'STOP',
        name: 'All-Way Stop',
        confidence: 0.97,
        distanceAhead: 35,
        actionRequired: 'FULL_STOP_REQUIRED',
        urgency: 'critical',
        category: 'Regulatory',
        description: 'Complete vehicle stop required before white limit line',
        box: { x: 68, y: 26, width: 15, height: 19 }
      },
      {
        id: 'dt-sign-2',
        type: 'SPEED_LIMIT',
        name: 'Speed Limit 25 MPH',
        value: 25,
        confidence: 0.96,
        distanceAhead: 90,
        actionRequired: 'MONITOR_SPEED',
        urgency: 'medium',
        category: 'Regulatory',
        description: 'City municipal residential speed limit',
        box: { x: 15, y: 30, width: 11, height: 15 }
      }
    ]
  },
  {
    id: 'construction',
    name: 'Corridor Reconstruction Work Zone',
    environment: 'construction_zone',
    defaultSpeed: 52,
    postedLimit: 40,
    weather: 'rain',
    roadCondition: 'Construction Zone',
    hazardDescription: 'Lane taper, roadwork personnel present, traffic cones, double fines zone',
    signs: [
      {
        id: 'cz-sign-1',
        type: 'CONSTRUCTION',
        name: 'Road Work Ahead 1500 FT',
        confidence: 0.96,
        distanceAhead: 65,
        actionRequired: 'PREPARE_MERGE',
        urgency: 'high',
        category: 'Work Zone',
        description: 'Reduced lanes ahead, follow traffic flagger directions',
        box: { x: 75, y: 28, width: 14, height: 17 }
      },
      {
        id: 'cz-sign-2',
        type: 'SPEED_LIMIT',
        name: 'Work Zone Speed Limit 40 MPH',
        value: 40,
        confidence: 0.99,
        distanceAhead: 48,
        actionRequired: 'DECELERATE_IMMEDIATELY',
        urgency: 'critical',
        category: 'Regulatory',
        description: 'Enforced speed limit with workers adjacent to roadway',
        box: { x: 22, y: 32, width: 13, height: 16 }
      }
    ]
  },
  {
    id: 'mountain_pass',
    name: 'Alpine Pass & Hairpin Curves',
    environment: 'mountain_pass',
    defaultSpeed: 48,
    postedLimit: 35,
    weather: 'fog',
    roadCondition: 'Wet/Rain',
    hazardDescription: 'Low visibility, slippery road surface, 25 mph advisory hairpin curve',
    signs: [
      {
        id: 'mp-sign-1',
        type: 'SHARP_CURVE',
        name: 'Winding Road Sharp Curve 25 MPH Advisory',
        confidence: 0.94,
        distanceAhead: 55,
        actionRequired: 'SLOW_FOR_CURVE',
        urgency: 'high',
        category: 'Warning',
        description: 'Sharp right curve ahead, reduced traction surface',
        box: { x: 70, y: 25, width: 13, height: 16 }
      },
      {
        id: 'mp-sign-2',
        type: 'SLIPPERY_ROAD',
        name: 'Slippery When Wet',
        confidence: 0.93,
        distanceAhead: 85,
        actionRequired: 'INCREASE_FOLLOWING_DISTANCE',
        urgency: 'medium',
        category: 'Warning',
        description: 'Road friction coefficient reduced due to moisture',
        box: { x: 20, y: 34, width: 12, height: 15 }
      }
    ]
  }
];
