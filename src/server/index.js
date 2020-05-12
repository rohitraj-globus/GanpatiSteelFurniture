// eslint-disable-next-line no-undef
const { Client } = require('pg');
const express = require('express');
require('dotenv').config();
const jsforce = require('jsforce');

/* update */
const app1 = express();
const bodyParser = require('body-parser');
const pg = require('pg');
app1.use(express.static('public'));
app1.use(bodyParser.json());
/* update */

const { SF_USERNAME, SF_PASSWORD } = process.env;
if (!(SF_USERNAME && SF_PASSWORD)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}
const conn = new jsforce.Connection({
    loginUrl: 'https://login.salesforce.com'
});
conn.login(SF_USERNAME, SF_PASSWORD, err => {
    if (err) {
        console.error(err);
        process.exit(-1);
    }
});

module.exports = app => {
    // put your express app logic here
    app.use(express.json());

    app.get('/data/products', (req, res) => {
        var products = [];

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: true
        });

        client.connect();

        client.query(
            'SELECT rohitraj__Product_Id__c,name,rohitraj__picture_url__c,rohitraj__Price__c,rohitraj__Category__c from salesforce.rohitraj__product__c WHERE rohitraj__Category__c is not null;',
            (err, data) => {
                if (err) console.log(err);
                products = data.rows.map(productRecord => {
                    return {
                        id: productRecord.rohitraj__Product_Id__c,
                        name: productRecord.name,
                        quantity: 0,
                        picture: "https://drive.google.com/uc?export=view&id="+productRecord.rohitraj__picture_url__c,
                        price: productRecord.rohitraj__price__c,
                        category: productRecord.rohitraj__Category__c,
                    };
                });
                res.json(products);
                client.end();
            }
        );
    });

    /*app.post('/data/placeOrder', (req, res) => {
        conn.apex.post('/placeOrder/', req.body, (err, data) => {
            if (err) {
                console.error(err);
            }
            res.json(data);
        });
    });*/
};

app1.post('/update', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function (err1, conn1, done) {
        // watch for any connect issues
        if (err1) console.log(err1);
        conn.query(
            'UPDATE salesforce.Contact SET Phone = $1, MobilePhone = $1 WHERE LOWER(FirstName) = LOWER($2) AND LOWER(LastName) = LOWER($3) AND LOWER(Email) = LOWER($4)',
            [req.body.phone.trim(), req.body.firstName.trim(), req.body.lastName.trim(), req.body.email.trim()],
            function(err, result) {
                if (err != null || result.rowCount === 0) {
                  conn.query('INSERT INTO salesforce.Contact (Phone, MobilePhone, FirstName, LastName, Email) VALUES ($1, $2, $3, $4, $5)',
                  [req.body.phone.trim(), req.body.phone.trim(), req.body.firstName.trim(), req.body.lastName.trim(), req.body.email.trim()],
                  function(er, reslt) {
                    done();
                    if (er) {
                        res.status(400).json({error: er.message});
                    }
                    else {
                        // this will still cause jquery to display 'Record updated!'
                        // eventhough it was inserted
                        res.json(result);
                    }
                  });
                }
                else {
                    done();
                    res.json(result);
                }
            }
        );
    });
});
