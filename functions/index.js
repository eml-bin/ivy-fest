require('dotenv').config();

const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const express = require('express');
const cors = require('cors')({ origin: true });

const adminWithCustomCredential = admin.initializeApp({
    credential: admin.credential.cert(process.env.PARTY_KEY),
    databaseURL: "https://ivy-party-default-rtdb.firebaseio.com"
});

const app = express();

// Function getGuests. Obtener invitados por código
const getGuests = onRequest(async (req, res) => {

    try {
        const db = adminWithCustomCredential.database();
        const guestCode = req.params.gc;
        const ref = db.ref(`guests/${guestCode}`);

        const snapshot = await ref.once('value');
        const guests = snapshot.val();

        if (!guests) {
            return res.status(400).send({});
        }

        return res.status(200).send(guests);
    } catch (error) {
        return res.status(500).send({});
    }
});

// Function updateConfirmation. Actualizar invitación
const updateConfirmation = onRequest(async (req, res) => {

    try {
        const db = adminWithCustomCredential.database();
        const guestCode = req.params.gc;
        const ref = db.ref(`guests/${guestCode}`);
        const confirmations = req.body.confirmations;

        return ref.once('value').then(snapshot => {
            const guests = snapshot.val();

            console.log(guests)

            confirmations.forEach(response => {

                const guest = guests.find(person => person.name === response.name);

                if (guest) {
                    guest.confirmation = response.confirmation;
                }
            });

            ref.update(guests);
            return res.status(204).send({});
        });
    } catch (error) {
        console.log(error)
        return res.status(500).send({});
    }
});

app.get('/guests/:gc', cors, getGuests);
app.put('/guests/:gc', cors, updateConfirmation);

exports.api = functions.https.onRequest(app)