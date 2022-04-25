/* eslint-disable no-restricted-syntax */
const { S3 } = require('aws-sdk');

const s3 = new S3();

const INDEX_KEYS = {
  name: 0,
  grade: 1,
  color: 2,
  year: 3,
};

const MIN_PARAMETERS = 2;

const S3_ROOT = 'https://cars-list.s3.us-west-2.amazonaws.com/';

const BUCKET_NAME = 'cars-list';

async function* listAllKeys(opts) {
  // eslint-disable-next-line no-param-reassign
  opts = { ...opts };
  do {
    // eslint-disable-next-line no-await-in-loop
    const data = await s3.listObjectsV2(opts).promise();
    // eslint-disable-next-line no-param-reassign
    opts.ContinuationToken = data.NextContinuationToken;
    yield data;
  } while (opts.ContinuationToken);
}

const opts = {
  Bucket: BUCKET_NAME,
};

function hasMinimumParameters(reqObj) {
  return Object.keys(reqObj).length >= MIN_PARAMETERS;
}

function matchCar(reqObj, carStr) {
  const carArr = carStr.split('-');
  return Object.keys(reqObj).filter((key) => reqObj[key] === carArr[INDEX_KEYS[key]]).length
    === Object.keys(reqObj).length;
}

// TODO make this smaller?
function whitelistKeys(reqObj) {
  return Object.keys(INDEX_KEYS).reduce((obj, key) => {
    if (reqObj[key]) {
      return {
        [key]: reqObj[key],
        ...obj,
      };
    }
    return obj;
  }, {});
}

const CarService = {
  getCars: async (reqObj) => {
    const validObj = whitelistKeys(reqObj);

    if (!hasMinimumParameters(validObj)) {
      throw new Error(`Need at least ${MIN_PARAMETERS} parameters`);
    }

    const foundCars = [];
    for await (const data of listAllKeys(opts)) {
      const batch = [];
      for (let { Key } of data.Contents) {
        Key = Key.slice(0, -4);
        if (matchCar(validObj, Key)) {
          batch.push(S3_ROOT + Key);
        }
      }
      foundCars.push(...batch);
    }

    return foundCars;
  },
};

module.exports = CarService;
