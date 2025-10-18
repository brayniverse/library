<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'type' => ['required', 'string'],
            'format' => ['required', 'string'],
            'year' => ['required', 'integer'],

            // Optional JSON custom attributes bag
            'custom_attributes' => ['sometimes', 'array'],

            // Film attributes (all optional)
            'custom_attributes.run_time' => ['sometimes', 'integer', 'min:0'],
            'custom_attributes.genres' => ['sometimes', 'array'],
            'custom_attributes.genres.*' => ['string'],
            'custom_attributes.description' => ['sometimes', 'string'],
            'custom_attributes.tagline' => ['sometimes', 'string'],

            // Arrays of objects with code+name
            'custom_attributes.countries' => ['sometimes', 'array'],
            'custom_attributes.countries.*.code' => ['required_with:custom_attributes.countries', 'string'],
            'custom_attributes.countries.*.name' => ['required_with:custom_attributes.countries', 'string'],

            'custom_attributes.languages' => ['sometimes', 'array'],
            'custom_attributes.languages.*.code' => ['required_with:custom_attributes.languages', 'string'],
            'custom_attributes.languages.*.name' => ['required_with:custom_attributes.languages', 'string'],

            // Directors from TMDB, array of strings
            'custom_attributes.directors' => ['sometimes', 'array'],
            'custom_attributes.directors.*' => ['string'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
