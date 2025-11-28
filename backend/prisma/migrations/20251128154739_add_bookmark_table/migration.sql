-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recommendation_id" TEXT,
    "category" "Category",
    "product_name" TEXT,
    "model_name" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookmarks_user_id_created_at_idx" ON "bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_recommendation_id_key" ON "bookmarks"("user_id", "recommendation_id");

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "price_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
