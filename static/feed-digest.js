// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0
'use strict';

(function () {
	let started = false;

	function configUrl(feedId) {
		const base = new URL(window.context && context.urls && context.urls.index ? context.urls.index : '.', window.location.href);
		base.searchParams.set('c', 'feedDigest');
		base.searchParams.set('a', 'config');
		base.searchParams.set('id', feedId);
		base.searchParams.set('_', String(Date.now()));
		base.hash = '';
		return base.toString();
	}

	function createFieldset(feedId) {
		const fieldset = document.createElement('fieldset');
		fieldset.className = 'feed-digest-settings';
		fieldset.innerHTML = [
			'<legend>Feed Digest</legend>',
			'<div class="form-group">',
			'<label class="group-name" for="feed_digest_enabled_' + feedId + '">Enable summaries</label>',
			'<div class="group-controls">',
			'<select name="feed_digest_enabled" id="feed_digest_enabled_' + feedId + '" class="w50">',
			'<option value="0">No</option>',
			'<option value="1">Yes</option>',
			'</select>',
			'<p class="help">Enable LLM summaries for this feed.</p>',
			'</div>',
			'</div>',
			'<div class="form-group">',
			'<label class="group-name" for="feed_digest_batch_size_' + feedId + '">Articles per summary batch</label>',
			'<div class="group-controls">',
			'<input type="number" name="feed_digest_batch_size" id="feed_digest_batch_size_' + feedId + '" class="w50" min="1" max="50" value="10" />',
			'<p class="help">A summary is created when unread articles reach this number. Use 1 for single-article translate/summary mode.</p>',
			'</div>',
			'</div>',
			'<div class="form-group form-actions">',
			'<div class="group-controls">',
			'<button type="submit" class="btn btn-important">Submit</button>',
			'<button type="reset" class="btn">Cancel</button>',
			'</div>',
			'</div>'
		].join('');
		return fieldset;
	}

	function applyConfig(fieldset, config) {
		const enabled = fieldset.querySelector('[name="feed_digest_enabled"]');
		const batchSize = fieldset.querySelector('[name="feed_digest_batch_size"]');
		if (enabled) {
			enabled.value = config && config.enabled ? '1' : '0';
		}
		if (batchSize && config && config.batch_size) {
			batchSize.value = String(config.batch_size);
		}
	}

	function enhanceForm(container) {
		const feedId = container.getAttribute('data-feed-id');
		const form = container.querySelector('form');
		if (!feedId || !form || form.dataset.feedDigestEnhanced === '1') {
			return;
		}

		form.dataset.feedDigestEnhanced = '1';
		const fieldset = createFieldset(feedId);
		const firstFieldset = form.querySelector('fieldset');
		if (firstFieldset) {
			firstFieldset.insertAdjacentElement('afterend', fieldset);
		} else {
			form.insertBefore(fieldset, form.firstChild);
		}

		fetch(configUrl(feedId), {
			credentials: 'same-origin',
			headers: {
				'Accept': 'application/json'
			}
		})
			.then((response) => response.ok ? response.json() : null)
			.then((config) => applyConfig(fieldset, config))
			.catch(() => {});
	}

	function scan() {
		document.querySelectorAll('#feed_update[data-feed-id]').forEach(enhanceForm);
	}

	function start() {
		if (started) {
			return;
		}
		started = true;
		scan();
		new MutationObserver(scan).observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	function startWhenReady() {
		if (!document.body) {
			document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
			return;
		}
		if (window.context) {
			start();
		} else {
			document.addEventListener('freshrss:globalContextLoaded', start, { once: true });
		}
	}

	startWhenReady();
}());
