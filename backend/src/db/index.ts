import { MongoClient, Db, Collection } from 'mongodb';
import { Reservation } from '../models/reservation';
import { logger } from '../utils/logger';

export interface MongoConnConfig {
	connectionString: string;
	dbName: string;
	username?: string;
	password?: string;
	collectionName: string;
}

export const MONGO_CONN: MongoConnConfig = {
	connectionString: process.env.MONGO_URI || 'mongodb://mongo:27017',
	dbName: process.env.MONGO_DB_NAME || 'reservations_db',
	username: process.env.MONGO_INITDB_ROOT_USERNAME || undefined,
	password: process.env.MONGO_INITDB_ROOT_PASSWORD || undefined,
	collectionName: process.env.MONGO_COLLECTION_NAME || 'reservations'
};

let client: MongoClient | null = null;
let db: Db | null = null;
let collection: Collection<any> | null = null;
let connected = false;

export async function connect(): Promise<{ client: MongoClient | null; collection: Collection<any> | null }> {
	if (connected && client && collection) return { client, collection };
	try {
		client = new MongoClient(MONGO_CONN.connectionString);
		await client.connect();
		db = client.db(MONGO_CONN.dbName);
		collection = db.collection(MONGO_CONN.collectionName);
		connected = true;
		logger.info('Connected to MongoDB');
		return { client, collection };
	} catch (err) {
		logger.error('MongoDB connect failed', err);
		throw err;
	}
}

export async function upsertReservation(id: string, doc: Reservation): Promise<Reservation> {
	if (!collection) throw new Error('MongoDB not connected');
	const filter = { _id: id };
	const toStore = { ...doc, arrivalTime: doc.arrivalTime } as any;
	await collection.updateOne(filter, { $set: toStore }, { upsert: true });
	return { id, ...toStore } as Reservation;
}

export async function getReservationById(id: string): Promise<Reservation | null> {
	if (!collection) throw new Error('MongoDB not connected');
	const res = await collection.findOne({ _id: id });
	if (!res) return null;
	const { _id, ...rest } = res as any;
	return { id: String(_id), ...rest } as Reservation;
}

export async function queryReservationsByDateStatusAndOwner(date?: string, status?: string, guestName?: string): Promise<Reservation[]> {
	if (!collection) throw new Error('MongoDB not connected');
	const filter: any = {};
	if (date) {
		const start = new Date(date + 'T00:00:00.000Z');
		const end = new Date(date + 'T23:59:59.999Z');
		filter.arrivalTime = { $gte: start.toISOString(), $lte: end.toISOString() };
	}
	if (status) filter.status = status;
	if (guestName) filter.guestName = guestName;
	const cursor = collection.find(filter).sort({ arrivalTime: 1 });
	const rows = await cursor.toArray();
	return rows.map((r: any) => {
		const { _id, ...rest } = r;
		return { id: String(_id), ...rest } as Reservation;
	});
}

export async function ensureIndexes() {
	if (!collection) return;
	try {
		await collection.createIndex({ arrivalTime: 1 });
		await collection.createIndex({ status: 1 });
		await collection.createIndex({ guestName: 1 });
		logger.info('Ensured MongoDB indexes');
	} catch (err) {
		logger.warn('Failed to create MongoDB indexes', err);
	}
}

export function isConnected() {
	return connected;
}
