import { LegacyInitiative } from '../types';

export const sampleInitiatives: LegacyInitiative[] = [
  {
    id: '1',
    title: 'Sustainable Farming Initiative - Nakuru',
    category: 'agriculture',
    location: { lat: -0.3031, lng: 36.0800 },
    county: 'Nakuru',
    targetAmount: 5000000,
    raisedAmount: 3200000,
    status: 'active',
    description: 'Promoting sustainable farming practices and modern irrigation systems for smallholder farmers in Nakuru County.'
  },
  {
    id: '2',
    title: 'Clean Water Access - Turkana',
    category: 'water',
    location: { lat: 3.1167, lng: 35.6000 },
    county: 'Turkana',
    targetAmount: 8000000,
    raisedAmount: 4500000,
    status: 'active',
    description: 'Building boreholes and water distribution systems to provide clean water access to remote communities.'
  },
  {
    id: '3',
    title: 'Rural Health Clinic - Kisumu',
    category: 'health',
    location: { lat: -0.0917, lng: 34.7680 },
    county: 'Kisumu',
    targetAmount: 12000000,
    raisedAmount: 7800000,
    status: 'active',
    description: 'Establishing a modern health clinic to serve rural communities with essential medical services.'
  },
  {
    id: '4',
    title: 'Digital Learning Centers - Nairobi',
    category: 'education',
    location: { lat: -1.2921, lng: 36.8219 },
    county: 'Nairobi',
    targetAmount: 6000000,
    raisedAmount: 6000000,
    status: 'completed',
    description: 'Setting up digital learning centers with computers and internet access for underserved schools.'
  },
  {
    id: '5',
    title: 'Road Infrastructure - Mombasa',
    category: 'infrastructure',
    location: { lat: -4.0435, lng: 39.6682 },
    county: 'Mombasa',
    targetAmount: 15000000,
    raisedAmount: 9200000,
    status: 'active',
    description: 'Improving road connectivity between rural areas and urban centers to boost economic activity.'
  },
  {
    id: '6',
    title: 'Youth Entrepreneurship Program - Eldoret',
    category: 'economic',
    location: { lat: 0.5143, lng: 35.2698 },
    county: 'Uasin Gishu',
    targetAmount: 4000000,
    raisedAmount: 1800000,
    status: 'active',
    description: 'Supporting young entrepreneurs with training, mentorship, and startup capital.'
  },
  {
    id: '7',
    title: 'Irrigation Project - Meru',
    category: 'agriculture',
    location: { lat: 0.0469, lng: 37.6559 },
    county: 'Meru',
    targetAmount: 7000000,
    raisedAmount: 2100000,
    status: 'stalled',
    description: 'Large-scale irrigation project to support year-round farming in Meru County.'
  },
  {
    id: '8',
    title: 'School Renovation - Kakamega',
    category: 'education',
    location: { lat: 0.2827, lng: 34.7519 },
    county: 'Kakamega',
    targetAmount: 3500000,
    raisedAmount: 3500000,
    status: 'completed',
    description: 'Renovating and expanding school facilities to accommodate more students.'
  }
];

