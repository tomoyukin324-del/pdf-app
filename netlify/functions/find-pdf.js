// netlify/functions/find-pdf.js

// 新しいバージョンのライブラリに対応したインポート方法
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 環境変数から認証情報を取得
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'ID管理'; // あなたのスプレッドシートのシート名

export const handler = async (event) => {
  // スプレッドシートの1行目のヘッダーは "ID" と "URL" になっている必要があります
  const ID_COLUMN_HEADER = 'ID';
  const URL_COLUMN_HEADER = 'URL';

  const id = event.queryStringParameters.id;

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ID is required' }) };
  }

  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); // loads document properties and worksheets

    const sheet = doc.sheetsByTitle[SHEET_NAME];
    if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);
    
    const rows = await sheet.getRows();
    const foundRow = rows.find(row => row.get(ID_COLUMN_HEADER) && row.get(ID_COLUMN_HEADER).toString() === id.toString());

    if (foundRow && foundRow.get(URL_COLUMN_HEADER)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: foundRow.get(URL_COLUMN_HEADER) }),
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