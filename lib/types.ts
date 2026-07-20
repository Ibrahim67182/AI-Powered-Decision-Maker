
// all the type definitions for the decision-making app 

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
  options: Option[];
  participants: Participant[];
  createdAt: string;

}