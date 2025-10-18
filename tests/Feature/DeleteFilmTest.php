<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('deletes a film via the films.destroy route', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $media = Media::factory()->create([
        'title' => 'To Delete',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
    ]);

    $response = $this->delete(route('films.destroy', $media));

    $response->assertRedirect(route('films.index'));

    $this->assertSoftDeleted('media', [
        'id' => $media->id,
        'title' => 'To Delete',
    ]);
});
