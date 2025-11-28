export interface Continent {
  code: string;
  name: string;
  capital: string;
}

export interface Country {
  code: string;
  name: string;
  native: string;
}

export interface State {
  code: string;
  name: string;
}

export interface Language {
  code: string;
  name: string;
  continent: Continent;
  languages: Language[];
  states: State[];
  native: string;
}