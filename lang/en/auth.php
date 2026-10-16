<?php

// Overrides only the framework strings the console shows; the rest fall back to Laravel's defaults.
// "failed" matches the till's wording (Api\V1\AuthController) and never says which half was wrong.
return [
    'failed' => 'Invalid email or password.',
];
