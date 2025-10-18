<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('includes directorsDistribution on dashboard reflecting film directors', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Seed films with directors
    Media::factory()->create([
        'title' => 'Film A',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
        'custom_attributes' => [
            'directors' => ['Christopher Nolan'],
        ],
    ]);

    Media::factory()->create([
        'title' => 'Film B',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 2002,
        'custom_attributes' => [
            'directors' => ['Denis Villeneuve'],
        ],
    ]);

    Media::factory()->create([
        'title' => 'Film C',
        'type' => MediaType::Film->value,
        'format' => 'VHS',
        'year' => 2003,
        'custom_attributes' => [
            'directors' => ['Christopher Nolan', 'Someone Else'],
        ],
    ]);

    // TV entries should not contribute
    Media::factory()->create([
        'title' => 'Show A',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 1999,
        'custom_attributes' => [
            'directors' => ['Christopher Nolan'],
        ],
    ]);

    $response = $this->get('/dashboard');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('directorsDistribution', function ($dist) {
                expect($dist)->toBeArray();
                $map = [];
                foreach ($dist as $row) {
                    $map[$row['name']] = $row['count'];
                }
                expect($map['Christopher Nolan'] ?? null)->toBe(2);
                expect($map['Denis Villeneuve'] ?? null)->toBe(1);
                expect($map['Someone Else'] ?? null)->toBe(1);

                return true;
            })
        );
});
