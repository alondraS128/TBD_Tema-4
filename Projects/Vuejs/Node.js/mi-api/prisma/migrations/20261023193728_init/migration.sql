-- CreateTable
CREATE TABLE "Tarea" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "prioridad" TEXT NOT NULL DEFAULT 'media',

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);
