<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
| Function-style tests run on Tests\TestCase against the Postgres "testing" database
| (see phpunit.xml and docker/pgsql), refreshed for each test.
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
