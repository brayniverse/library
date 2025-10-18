<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('shows films index page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get('/films');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films')
            ->has('formats')
        );
});
