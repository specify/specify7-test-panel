import type { LocalizationStrings } from '../lib/languages';

const commonLocalizationStrings: LocalizationStrings<{
  readonly yes: string;
  readonly no: string;
  readonly add: string;
  readonly delete: string;
  readonly goBack: string;
  readonly cancel: string;
}> = {
  'en-US': {
    yes: 'Yes',
    no: 'No',
    add: 'Add',
    delete: 'Delete',
    goBack: 'Go Back',
    cancel: 'Cancel',
  },
};

export default commonLocalizationStrings;
