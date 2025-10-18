<?php

namespace Database\Factories;

use App\Models\Film;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class FilmFactory extends Factory
{
    protected $model = Film::class;

    public function definition()
    {
        return [
            'title' => $this->faker->word(),
            'year' => $this->faker->randomNumber(),
            'format' => $this->faker->word(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }
}
