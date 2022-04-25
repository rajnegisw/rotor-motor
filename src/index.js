const CarService = require('./CarService');

exports.handler = async (event) => {
  const response = {};
  try {
    const searchResult = await CarService.getCars(event.queryStringParameters);

    response.data = searchResult;
    response.message = 'Results fetched!';
    response.code = 200;
    return response;
  } catch (error) {
    response.code = 400;

    if (error) {
      response.ErrorMessages = [error.message, JSON.stringify(error)];
    }

    return response;
  }
};
