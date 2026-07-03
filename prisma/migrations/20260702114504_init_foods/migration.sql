-- CreateTable
CREATE TABLE "Food" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "servingSize" REAL NOT NULL,
    "servingUnit" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "fiber" REAL,
    "sugar" REAL,
    "sodium" REAL,
    "saturatedFat" REAL,
    "transFat" REAL,
    "cholesterol" REAL,
    "potassium" REAL,
    "calcium" REAL,
    "iron" REAL,
    "source" TEXT NOT NULL DEFAULT 'gemini',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_name_key" ON "Food"("name");
