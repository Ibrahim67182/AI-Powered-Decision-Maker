
// all the type definitions for the decision-making app 


export type Domain = 'event' | 'service' | 'food';  // user can select one of these domains when creating a decision

export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'tags';
}

// Predefined attribute schema per domain — this is what keeps the app generic
// while still giving users relevant fields instead of one hardcoded set.
export const DOMAIN_ATTRIBUTES: Record<Domain, AttributeDefinition[]> = {
  event: [
    { key: 'cost', label: 'Cost', type: 'number' },
    { key: 'venueType', label: 'Venue Type', type: 'string' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'indoor', label: 'Indoor', type: 'boolean' },
    { key: 'distanceMinutes', label: 'Distance (min)', type: 'number' },
    { key: 'amenities', label: 'Amenities', type: 'tags' },
  ],
  service: [
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'turnaroundDays', label: 'Turnaround (days)', type: 'number' },
    { key: 'remote', label: 'Remote', type: 'boolean' },
    { key: 'certifications', label: 'Certifications', type: 'tags' },
  ],
  food: [
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'cuisine', label: 'Cuisine', type: 'string' },
    { key: 'dietaryTags', label: 'Dietary Tags', type: 'tags' },
    { key: 'outdoor', label: 'Outdoor Seating', type: 'boolean' },
    { key: 'distanceMinutes', label: 'Distance (min)', type: 'number' },
  ],
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  event: 'Event',
  service: 'Service',
  food: 'Food Planning',
};




export type ConstraintType = 'hard' | 'soft';


export type Operator = | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'includes'               // for array attributes like dietaryTags includes "vegetarian"
  | 'excludes';


// defining constraints for each participant to filter the options along with the operator and value to compare against the option's attribute
export interface Constraint {
  id: string;
 
  participantId: string;
 
  label: string;            // main constraint label for display, e.g. "Price must be under $30"
 
  attribute: string;        // must match a key in Option.attributes, e.g. "price"
 
  type: ConstraintType;     // 'hard' = disqualifying, 'soft' = scored preference
 
  operator: Operator;
 
  value: string | number | boolean;   // can be a string, number, or boolean depending on the attribute type, e.g. 30 for price, "vegetarian" for dietaryTags, true for outdoor seating
 
  weight?: number;          // using the 1-5 scale score , only used when constraint type is soft not applicable for hard constraints


}

// defining attributes to add them inside an option
export type AttributeValue = string | number | boolean | string[];


// options having structured attributes 
export interface Option {
  id: string;
  name: string;
  attributes: Record<string, AttributeValue>;
  // a key-values object of attributes  e.g. { price: 25, location: "Downtown", dietaryTags: ["vegetarian"], outdoor: false }
}


 // each participiant having constraints defined above to filter the options

export interface Participant {
  id: string;
  name: string;
  constraints: Constraint[];
}

// finally the decision object having all the options and participants with their constraints

export interface Decision {
  id: string;
  title: string;
  description?: string;
  domain: Domain;
  options: Option[];
  participants: Participant[];
  createdAt: string;

}