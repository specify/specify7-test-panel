import type { Fields, File, Files } from 'formidable';
import { IncomingForm } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../lib/apiUtils';
import { generateDatabaseNameWithDate } from '../../../lib/databaseNameHelper';
import { uploadQueue } from '../../../lib/uploadQueue';

// First we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUser(request, res);
    if (typeof user === 'undefined') return;

    const data = await new Promise<{ fields: Fields; files: Files } | string>((resolve, reject) => {
      const form = new IncomingForm({
        maxFileSize: 4 * 1024 * 1024 * 1024,
      });
      form.parse(request, (error, fields, files) => {
        if (error) reject(error.toString());
        else resolve({ fields, files });
      });
    });

    if (typeof data === 'string') return res.status(400).json({ error: data });

    const databaseNameForm = data.fields.databaseName as string | undefined;
    if (!databaseNameForm)
      return res.status(400).json({ error: 'Database name is required' });
    if (databaseNameForm.match(/^\w+$/) === null)
      return res.status(400).json({ error: 'Database name is invalid' });
    const databaseName = generateDatabaseNameWithDate(databaseNameForm);
    const file = data.files.file as File | undefined;
    if (typeof file === 'undefined' || file.newFilename === null)
      return res.status(400).json({ error: 'No file is attached' });

    // Save file path and database name in job data
    const job = await uploadQueue.add({
      filePath: file.filepath,
      databaseName,
      originalFilename: file.originalFilename,
    });

    // Respond with job ID for frontend polling
    res.status(200).json({ jobId: job.id });
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
}
