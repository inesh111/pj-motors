-- CreateTable
CREATE TABLE "Car" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chassisCode" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER,
    "colour" TEXT,
    "grade" TEXT,
    "totalPurchasePriceAUD" DECIMAL NOT NULL,
    "salePrice" DECIMAL,
    "profit" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'JAPAN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CarDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "carId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarDocument_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_chassisCode_key" ON "Car"("chassisCode");

-- CreateIndex
CREATE INDEX "CarDocument_carId_type_idx" ON "CarDocument"("carId", "type");
