import { PrismaClient } from '@prisma/client'

// Single shared Prisma client instance for the app.
// Used by database features in later stages.
export const prisma = new PrismaClient()
