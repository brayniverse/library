<?php

use App\Http\Controllers\Settings\PasskeysController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/passkeys', function () {
        return Inertia::render('settings/passkeys', [
            'passkeys' => auth()
                ->user()
                ->passkeys()
                ->get()
                ->map(fn ($passkey) => $passkey->only('id', 'name', 'last_used_at')),
        ]);
    })->name('passkeys.edit');

    Route::get('settings/passkeys/key-options', [PasskeysController::class, 'show'])
         ->name('passkeys.passkey-options');

    Route::post('settings/passkeys', [PasskeysController::class, 'create'])
         ->name('passkeys.store');

    Route::delete('settings/passkeys/{id}', [PasskeysController::class, 'destroy'])
         ->name('passkeys.destroy');
});
