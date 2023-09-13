app.get('/', async(req, res) =>{
    const auth = new google.auth.GoogleAuth({

        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spredsheets"

    })

    const client = await auth.getClient();

    const googleSheets = google.sheets({version: "v4" , auth: client});
    const spreadsheetId = process.env.SHEET_ID

    const metaData = await googleSheets.spreadsheets.get({

        auth,
        spreadsheetId
     })
   
   res.send(metaData)
})