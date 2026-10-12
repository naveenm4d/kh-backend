<?php

namespace App\Support;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * JSON with a content-hash ETag. A till that already has this exact data gets a bodiless 304.
 */
final class ConditionalResponse
{
    public static function json(Request $request, mixed $data): Response
    {
        $body = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $etag = '"'.hash('xxh128', $body).'"';

        $response = response($body, 200, ['Content-Type' => 'application/json']);
        $response->headers->set('ETag', $etag);
        $response->headers->set('Cache-Control', 'private, no-cache');

        if (in_array($etag, $request->getETags(), true)) {
            $response->setNotModified();
        }

        return $response;
    }
}
