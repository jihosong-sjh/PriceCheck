-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SMARTPHONE', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'EARPHONE');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('BUNJANG', 'JOONGONARA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "category" "Category" NOT NULL,
    "product_name" TEXT NOT NULL,
    "model_name" TEXT,
    "condition" "Condition" NOT NULL,
    "recommended_price" INTEGER NOT NULL,
    "price_min" INTEGER NOT NULL,
    "price_max" INTEGER NOT NULL,
    "market_data_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "model_name" TEXT,
    "platform" "Platform" NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" TEXT,
    "original_url" TEXT,
    "scraped_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "price_recommendations_user_id_created_at_idx" ON "price_recommendations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "price_recommendations_product_name_idx" ON "price_recommendations"("product_name");

-- CreateIndex
CREATE INDEX "price_recommendations_category_idx" ON "price_recommendations"("category");

-- CreateIndex
CREATE INDEX "market_data_product_name_platform_scraped_at_idx" ON "market_data"("product_name", "platform", "scraped_at" DESC);

-- CreateIndex
CREATE INDEX "market_data_scraped_at_idx" ON "market_data"("scraped_at" DESC);

-- CreateIndex
CREATE INDEX "product_images_recommendation_id_idx" ON "product_images"("recommendation_id");

-- AddForeignKey
ALTER TABLE "price_recommendations" ADD CONSTRAINT "price_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "price_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
