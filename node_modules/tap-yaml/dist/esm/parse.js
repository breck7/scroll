import yaml from 'yaml';
import { customTags } from './types/index.js';
export const parse = (str) => yaml.parse(str, { customTags, prettyErrors: true });
//# sourceMappingURL=parse.js.map