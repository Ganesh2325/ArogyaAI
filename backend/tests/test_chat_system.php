<?php

use App\Services\AIService;
use App\Services\ChatService;
use App\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$aiService = new AIService();
$chatService = new ChatService($aiService);

// Ensure we have a test user
$user = User::firstOrCreate(['email' => 'test@example.com'], [
    'name' => 'Test User',
    'password' => bcrypt('password')
]);

echo "--- STARTING AI CHAT TESTS ---\n\n";

// Case 1: Valid health query
echo "Test 1: Valid Health Query ('I have a mild fever')\n";
$result1 = $chatService->processMessage("I have a mild fever", $user->id);
echo "Triage: " . ($result1['triage'] ?? 'N/A') . " (" . ($result1['color_code'] ?? 'N/A') . ")\n";
echo "Message: " . $result1['message'] . "\n";
echo "Follow-up: " . ($result1['follow_up'] ?? 'N/A') . "\n\n";

// Case 2: Rejected non-health query
echo "Test 2: Non-Health Query ('Write a python script to sort a list')\n";
$result2 = $chatService->processMessage("Write a python script to sort a list", $user->id);
echo "Rejected: " . ($result2['is_rejected'] ? 'YES' : 'NO') . "\n";
echo "Message: " . $result2['message'] . "\n\n";

// Case 3: Emergency escalation
echo "Test 3: Emergency Escalation ('I have severe chest pain and can't breathe')\n";
$result3 = $chatService->processMessage("I have severe chest pain and can't breathe", $user->id);
echo "Triage: " . ($result3['triage'] ?? 'N/A') . " (" . ($result3['color_code'] ?? 'N/A') . ")\n";
echo "Message: " . $result3['message'] . "\n";
echo "Follow-up: " . ($result3['follow_up'] ?? 'N/A') . "\n\n";

echo "--- TESTS COMPLETED ---\n";
