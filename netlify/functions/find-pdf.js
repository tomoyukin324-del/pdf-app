const { GoogleSpreadsheet } = require('google-spreadsheet');

const creds = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'ID管理'; // あなたのスプレッドシートのシート名

exports.handler = async (event) => {
  // スプレッドシートの1行目のヘッダーは "ID" と "URL" になっている必要があります
  const ID_COLUMN_HEADER = 'ID';
  const URL_COLUMN_HEADER = 'URL';

  const id = event.queryStringParameters.id;

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ID is required' }) };
  }

  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[SHEET_NAME];
    if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);
    
    const rows = await sheet.getRows();
    const foundRow = rows.find(row => row[ID_COLUMN_HEADER] && row[ID_COLUMN_HEADER].toString() === id.toString());

    if (foundRow && foundRow[URL_COLUMN_HEADER]) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: foundRow[URL_COLUMN_HEADER] }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'ID not found' }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message }),
    };
  }
};