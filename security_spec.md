# Firestore Security Specification

This document outlines the attribute-based access control and zero-trust policies applied to our physical geospatial data engine.

## 1. Core Data Invariants
- **Owner Isolation**: A site plan document must always belong to the user who generated it (`userId == request.auth.uid`). No user may view, update, delete, or create plans belonging to other users.
- **Terminal Timestamps**: Generation timestamp `createdAt` is immutable.
- **Structural Sanity**: All coordinate structures and metadata properties are strongly typed and key-constrained on create and update.
- **System Stats Integrity**: Global platform stats can only be updated by authenticated users, and values must be strictly integers or numbers.

## 2. Security Rules (Target)
The target `firestore.rules` enforces that:
1. Every write is authenticated.
2. Every document ID matches structural requirements (`isValidId`).
3. Payload shape conforms exactly to schemas to prevent update-gaps and memory injection attacks.

## 3. Threat Payload Analysis (Dirty Dozen)
The following exploits will be automatically rejected.
1. Attempting to save a plan for a spoofed User ID (`userId` != authenticated uid).
2. Attempting to read a plan belonging to another user.
3. Attempting to overwrite the immutable `createdAt` timestamp during an update.
4. Attempting to save structural plans without active authentication.
5. Injecting unauthorized attributes or random fields into a site plan document.
6. Attempting to write a negative value for property size `acreage`.
7. Attempting to write system stats with invalid types or non-numeric values.
