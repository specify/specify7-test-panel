import type { LocalizationStrings } from '../lib/languages';

const commonLocalizationStrings: LocalizationStrings<{
  readonly yes: string;
  readonly no: string;
  readonly add: string;
  readonly delete: string;
}> = {
  'en-US': {
    yes: 'Yes',
    no: 'No',
    add: 'Add',
    delete: 'Delete',
  },
};

export default commonLocalizationStrings;
