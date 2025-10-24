<?php

namespace Database\Factories;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'type' => \App\Enums\MediaType::Film->value,
            'format' => \App\Enums\MediaFormat::DVD->value,
            'year' => (int) $this->faker->numberBetween(1950, 2024),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
