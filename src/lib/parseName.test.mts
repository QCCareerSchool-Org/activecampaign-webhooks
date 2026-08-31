import { parseName } from './parseName.mjs';

type NameExample = [ fullName: string, parsed: { firstName: string; lastName: string } ];

describe('parseName', () => {

  test.each<NameExample>([
    [ 'Thomas Anderson', { firstName: 'Thomas', lastName: 'Anderson' } ],
    [ 'María de la Cruz', { firstName: 'María', lastName: 'de la Cruz' } ],
    [ 'De Andre Smith', { firstName: 'De Andre', lastName: 'Smith' } ],
    [ 'de la Rosa Smith', { firstName: 'de la Rosa', lastName: 'Smith' } ],
    [ 'van der Meer Smith', { firstName: 'van der Meer', lastName: 'Smith' } ],
    [ "O' Connor Smith", { firstName: "O' Connor", lastName: 'Smith' } ],
    [ "O'Connor Smith", { firstName: "O'Connor", lastName: 'Smith' } ],
    [ 'Saint John Smith', { firstName: 'Saint John', lastName: 'Smith' } ],
    [ 'Madonna', { firstName: 'Madonna', lastName: '' } ],
    [ '  Thomas   Anderson  ', { firstName: 'Thomas', lastName: 'Anderson' } ],
    [ '', { firstName: '', lastName: '' } ],
  ])('parses "%s"', (fullName, expectedName) => {
    expect(parseName(fullName)).toEqual(expectedName);
  });

});
