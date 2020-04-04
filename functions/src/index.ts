import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'

admin.initializeApp( functions.config().firebase )

const apiClient = axios.create({
    baseURL: 'https://game.aq3d.com/api/Game/ServerList/',
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json'
    }
})

export const scheduledFunction = functions.pubsub.schedule('every 1 mins').onRun( async context => {
    // Grab server data
    const response = await apiClient.get('/')

    // Add the current snapshot to the DB
    await admin
        .firestore()
        .collection( 'server-snapshots' )
        .doc( 'current-status' )
        .set({ ...response.data })
        .then( ref => console.log(`Took a server status snapshot on ${new Date()}`) )

    return null
})

/* ALTERNATE: This function saves snapshots every minute and keeps logs up to a year old
    export const scheduledFunction = functions.pubsub.schedule('every 1 mins').onRun( async context => {
        // Get the current date
        const nowDate = new Date(),
            nowTimestamp = admin.firestore.Timestamp.fromDate(nowDate)

        // Grab server data
        const response = await apiClient.get('/')
        const serverData = { ts: nowTimestamp,...response.data }

        // Add the current snapshot to the DB
        await admin
            .firestore()
            .collection( 'server-snapshots' )
            .add( serverData )
            .then( ref => console.log(`Took a server status snapshot on ${nowDate}`) )
    
        // Get a date from 1 year ago
        const cuttoffDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            cuttoffTimestamp = admin.firestore.Timestamp.fromDate(cuttoffDate)

        // Delete snapshots from over a year ago
        await admin
            .firestore()
            .collection( 'server-snapshots' )
            .where('ts', '<', cuttoffTimestamp )
            .get()
            .then( querySnapshot => {
                querySnapshot.forEach( async doc => await doc.ref.delete() )
                console.log(`Deleted ${querySnapshot.size} old records from before ${cuttoffDate}`)
            })
            
        return null
    })
*/