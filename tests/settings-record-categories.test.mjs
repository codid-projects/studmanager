import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const categories = JSON.parse(readFileSync(new URL('../lib/settings-record-categories.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../public/locales/en.json', import.meta.url), 'utf8'));
const ar = JSON.parse(readFileSync(new URL('../public/locales/ar.json', import.meta.url), 'utf8'));

const expectedRecordCategories = {
  bloodTest: 1,
  wormDose: 2,
  injuries: 3,
  medicalCare: 4,
  medications: 5,
  medicationReasons: 6,
  xRay: 7,
  vaccinations: 8,
  vaccinationReasons: 9,
  shoeing: 10,
  hoofLegCare: 11,
  trainings: 12,
  competitions: 13,
  haircuts: 14,
  growth: 15,
};

const healthcareCategoryIds = [
  'bloodTest',
  'wormDose',
  'injuries',
  'medicalCare',
  'medications',
  'medicationReasons',
  'xRay',
  'vaccinations',
  'vaccinationReasons',
  'shoeing',
  'hoofLegCare',
  'growth',
];

const performanceCategoryIds = ['trainings', 'competitions', 'haircuts'];

test('settings expose every backend SettingRecord category used by the app', () => {
  assert.deepEqual(categories.recordCategories, expectedRecordCategories);
});

test('every backend record category has a visible Settings tab', () => {
  const tabIds = new Set(categories.items.map((item) => item.id));

  for (const id of Object.keys(expectedRecordCategories)) {
    assert.equal(tabIds.has(id), true, `${id} is missing from Settings tabs`);
  }
});

test('healthcare and performance lookup categories are all covered', () => {
  for (const id of [...healthcareCategoryIds, ...performanceCategoryIds]) {
    assert.equal(typeof categories.recordCategories[id], 'number', `${id} has no backend category id`);
  }
});

test('every Settings tab has English and Arabic labels', () => {
  for (const item of categories.items) {
    assert.equal(typeof en.settings[item.labelKey], 'string', `${item.labelKey} missing from en.json`);
    assert.equal(typeof ar.settings[item.labelKey], 'string', `${item.labelKey} missing from ar.json`);
    assert.notEqual(en.settings[item.labelKey], item.labelKey);
    assert.notEqual(ar.settings[item.labelKey], item.labelKey);
  }
});

test('all Settings tabs are backed by backend settings endpoints', () => {
  const backendIds = new Set([
    'contactGroups',
    'supplements',
    ...Object.keys(expectedRecordCategories),
  ]);
  const nonBackendIds = categories.items
    .map((item) => item.id)
    .filter((id) => !backendIds.has(id));

  assert.deepEqual(nonBackendIds, []);
});
