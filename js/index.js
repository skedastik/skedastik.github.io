var startTime = Date.now() + 2000;

var isDragging = false;

var minimizedRadius = 12,
	expandedRadius = 128;

var links = [
	{source: "alberti", target: "skedastik"},
	{source: "freeform", target: "skedastik"}
];

var nodes = {};

var width = 512,
	height = 512;

var center = {x:width/2, y:height/2},
	radius = expandedRadius + minimizedRadius*4;

// Compute nodes from links. Replace id's in links array with object refs.
links.forEach(function(link) {
	link.source = nodes[link.source] || (nodes[link.source] = node(link.source));
	link.target = nodes[link.target] || (nodes[link.target] = node(link.target));
});

// Each node has two custom attributes: id, expanded. The nodes are placed randomly along a ring around the center of the layout. This reduces the initial "heat" of the layout.
function node(id) {
	var alpha = Math.random() * Math.PI * 2,
		dx = Math.cos(alpha) * radius,
		dy = Math.sin(alpha) * radius,
		xp = center.x + dx,
		yp = center.y + dy;
	
	return {id:id, expanded:false, x:xp, y:yp, px:xp, py:yp};
}

// The root node (skedastik) is expanded by default. It is centered.
var expandedNode = nodes.skedastik;
expandedNode.expanded = true;
expandedNode.x = 256;
expandedNode.y = 256;
expandedNode.px = 256;
expandedNode.py = 256;

// Initialize the force layout.
var force = d3.layout.force()
	.size([width, height])
    .nodes(d3.values(nodes))
    .links(links)
	.on("tick", tick)
	.linkDistance(200)
	.charge(function(d) { return d.expanded ? -2400 : -300; });
	
var path, circle;

function init() {
	// When mouse enters project section, expand corresponding node.
	var hoverinfoElements = d3.selectAll(".hoverinfo");
	hoverinfoElements.on("mouseenter", hoverInfo);
		
	var svg = d3.select("#widget")
		.attr("fill", "gray");
	
	var link = svg.selectAll(".link"),
	    node = svg.selectAll(".node");
		
	// Thumbnail images are loaded as patterns.
	svg.append("defs").selectAll("pattern")
		.data(d3.values(nodes))
	  	.enter().append("pattern")
	    	.attr("id", thumbnailPatternId)
	    	.attr("width", "100%")
			.attr("height", "100%")
		.append("image")
			.attr("width", "256")
			.attr("height", "256")
	    	.attr("xlink:href", thumbnailImageUrl);

    // Create link elements.
	path = svg.append("g").selectAll("path")
		.data(force.links())
		.enter().append("path")
			.attr("class", "link");
	
    // Create node elements.
	circle = svg.append("g").selectAll("circle")
		.data(force.nodes())
		.enter().append("circle")
			.attr("fill", thumbnailPatternUrl)
			.attr("class", "node")
			.on("mousedown", function() { isDragging = true; })
			.on("mouseup", function() { isDragging = false; })
			.call(updateRadii)
			.call(force.drag);
		
	// Call tick to initialize node positions before starting the force layout (otherwise the SVG elements are collected in the top left corner for the first tick, causing a brief, but noticeable strobing effect).	
	tick();
			
	// Start the force layout.
	force.start();
}

function thumbnailImageUrl(d) {
	return "images/proj."+d.id+".jpg";
}

function thumbnailPatternId(d) {
	return d.id+"_pat";
}

function thumbnailPatternUrl(d) {
	return "url(#"+thumbnailPatternId(d)+")";
}

function tick() {
	path.attr("d", linkPath);
	circle.attr("transform", circleTransform);
}

function linkPath(d) {
	return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
}

function circleTransform(d) {
	return "translate(" + d.x + "," + d.y + ")";
}

function updateRadii(selection) {
	return selection.attr("r", function(d) { return d.expanded ? expandedRadius : minimizedRadius })
}

function expandNode(id) {
	if (Date.now() > startTime && id != expandedNode.id && !isDragging) {
		expandedNode.expanded = false;
		expandedNode = nodes[id];
		expandedNode.expanded = true;
		
		// Animate radii changes.
		circle.transition().call(updateRadii);
		
		// Update charge forces by calling start again.
		force.start();
	}
}

function hoverInfo() {
	console.log(this.getAttribute("data-skd-proj-id"));
	expandNode(this.getAttribute("data-skd-proj-id"));
}
