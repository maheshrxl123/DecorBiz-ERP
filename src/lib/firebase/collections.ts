/**
 * DecorBiz Canonical Firestore Collection Paths (PRD Section 3.3)
 * Single-business root collections with compatibility helpers for active workspace paths.
 */

import { collection, doc, type Firestore } from 'firebase/firestore';

export const ROOT_COLLECTIONS = {
  business: 'business',
  settings: 'settings',
  staff: 'staff',
  customers: 'customers',
  users: 'users',
  productLines: 'productLines',
  categories: 'categories',
  brands: 'brands',
  series: 'series',
  products: 'products',
  variants: 'variants',
  balances: 'balances',
  stockMoves: 'stockMoves',
  parties: 'parties',
  bills: 'bills',
  quotations: 'quotations',
  payments: 'payments',
  purchases: 'purchases',
  expenses: 'expenses',
  breakage: 'breakage',
  warranties: 'warranties',
  webOrders: 'webOrders',
  reviews: 'reviews',
  content: 'content',
  coupons: 'coupons',
  enquiries: 'enquiries',
  counters: 'counters',
  audit: 'audit',
} as const;

export function businessProfileDoc(db: Firestore) {
  return doc(db, ROOT_COLLECTIONS.business, 'profile');
}

export function moduleSettingsDoc(db: Firestore) {
  return doc(db, ROOT_COLLECTIONS.settings, 'modules');
}

export function schemaVersionDoc(db: Firestore) {
  return doc(db, ROOT_COLLECTIONS.settings, 'schema');
}

export function counterDoc(db: Firestore, series: 'CNT' | 'WEB') {
  return doc(db, ROOT_COLLECTIONS.counters, series);
}

export function orgCollection(db: Firestore, orgId: string, subcollection: string) {
  return collection(db, 'organizations', orgId, subcollection);
}
