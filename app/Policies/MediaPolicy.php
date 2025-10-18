<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MediaPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Media $media)
    {
        return true;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Media $media)
    {
        return true;
    }

    public function delete(User $user, Media $media)
    {
        return true;
    }

    public function restore(User $user, Media $media)
    {
        return true;
    }

    public function forceDelete(User $user, Media $media)
    {
        return true;
    }
}
