<?php
declare(strict_types=1);

final class FreshExtension_feedDigest_Controller extends FreshRSS_ActionController {
	#[\Override]
	public function firstAction(): void {
		$this->view->_layout(null);
	}

	public function configAction(): void {
		if (!FreshRSS_Auth::hasAccess()) {
			$this->renderJson(['error' => 'forbidden'], 403);
		}

		$feedId = Minz_Request::paramInt('id');
		if ($feedId <= 0) {
			$this->renderJson(['error' => 'invalid_feed'], 400);
		}

		$feedDAO = FreshRSS_Factory::createFeedDao();
		$feed = $feedDAO->searchById($feedId);
		if ($feed === null) {
			$this->renderJson(['error' => 'not_found'], 404);
		}

		$batchSize = $feed->attributeInt('feed_digest_batch_size') ?: 10;
		$this->renderJson([
			'enabled' => $feed->attributeBoolean('feed_digest_enabled') === true,
			'batch_size' => max(1, min(50, $batchSize)),
		]);
	}

	private function renderJson(array $payload, int $status = 200): void {
		http_response_code($status);
		header('Content-Type: application/json; charset=UTF-8');
		header('Cache-Control: private, no-cache, no-store, must-revalidate');
		echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		exit;
	}
}
