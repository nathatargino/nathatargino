// Proteção anti-crash de mutações do React DOM no Main World da página
(function() {
    try {
        const origRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function(child) {
            if (!child) return child;
            if (child.parentNode !== this) {
                if (child.parentNode && typeof child.parentNode.removeChild === 'function') {
                    return child.parentNode.removeChild(child);
                }
                return child;
            }
            return origRemoveChild.apply(this, arguments);
        };

        const origInsertBefore = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function(newNode, referenceNode) {
            if (referenceNode && referenceNode.parentNode !== this) {
                if (referenceNode.parentNode && typeof referenceNode.parentNode.insertBefore === 'function') {
                    return referenceNode.parentNode.insertBefore(newNode, referenceNode);
                }
                return this.appendChild(newNode);
            }
            return origInsertBefore.apply(this, arguments);
        };
    } catch (_) { }
})();
