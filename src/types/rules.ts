export interface RuleItem {
  id: string;
  text: string;
  pdfPage: number;
  tags: string[];
  subItems?: RuleItem[];
}

export interface RuleSection {
  id: string;
  title: string;
  pdfPage: number;
  tags: string[];
  items: RuleItem[];
  subsections?: RuleSection[];
}

export interface RuleSet {
  id: string;
  title: string;
  pdfPath: string;
  sections: RuleSection[];
}