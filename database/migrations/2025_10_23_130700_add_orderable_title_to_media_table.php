<?php

use App\Models\Media;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('orderable_title')->nullable()->index()->after('title');
        });

        // Backfill existing rows in a database-agnostic way
        Media::query()
            ->select(['id', 'title'])
            ->orderBy('id')
            ->chunkById(500, function ($rows): void {
                foreach ($rows as $row) {
                    $title = (string) ($row->title ?? '');
                    $lower = strtolower($title);
                    $normalized = str_starts_with($lower, 'the ') ? substr($lower, 4) : $lower;

                    DB::table('media')
                        ->where('id', $row->id)
                        ->update(['orderable_title' => $normalized]);
                }
            }, 'id');
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex(['orderable_title']);
            $table->dropColumn('orderable_title');
        });
    }
};
