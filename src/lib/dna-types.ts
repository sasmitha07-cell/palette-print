export interface StyleDNA {
  id: string;
  styleName: string;
  confidence: number;

  summary: string;

  palette: {
    hex: string;
    percentage: number;
  }[];

  mood: string[];

  typography: {
    primary: string;
    secondary: string;
  };

  fingerprint: {
    minimalism: number;
    luxury: number;
    modernity: number;
    boldness: number;
    creativity: number;
    editorial: number;
  };
  // optional for future phases
  tags?: string[];
  createdAt?: string;
}
