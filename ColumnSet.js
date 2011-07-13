define(["xstyle/css!./css/columnset.css", "dojo/has", "xstyle/put", "dojo/_base/declare", "dojo/on", "dojo/aspect", "dojo/query", "./Grid", "dojo/_base/sniff"], 
function(css, has, put, declare, listen, aspect, query, Grid){
		//	summary:
		//		This module provides column sets to isolate horizontal scroll of sets of 
		// 		columns from each other. This mainly serves the purpose of allowing for
		// 		column locking. 
	if(has("ie") < 8 || has("quirks")){
		// need position: relative in old IE to work properly
		css.addRule("table.dgrid-row", "position: relative");
	}
	
	return declare([Grid], {
		columnSets: [],
		createRowCells: function(tag, each){
			var row = put("table");			
			if(has("ie") < 8 && !has("quirks")){
				row.style.width = "auto"; // in IE7 this is needed to instead of 100% to make it not create a horizontal scroll bar
			}
			var tr = put(row, "tbody tr");
			for(var i = 0, l = this.columnSets.length; i < l; i++){
				// iterate through the columnSets
				var columnSet = this.columnSets[i];
				var cell = put(tr, tag + ".dgrid-column-set-cell.column-set-" + i + " div.dgrid-column-set[colsetid=" + i + "]");
				/*var td = put(tag + ".dgrid-column-set[colsetid=" + i + "]"*/
				if(dojo.isIE < 8 && !dojo.isQuirks){
					cell.style.width = "auto"; // in IE7 this is needed to instead of 100% to make it not create a horizontal scroll bar
				}
				this.columns = columnSet;
				cell.appendChild(this.inherited(arguments));
			}
			return row;
		},
		insertRow: function(){
			var row = this.inherited(arguments);
			adjustScrollLeft(this, row);
			return row;
		},
		renderHeader: function(){
			// summary:
			//		Setup the headers for the grid
			this.inherited(arguments);
			var columnSets = this.columnSets;
			this.bodyNode.style.bottom = "17px";
			var domNode = this.domNode;
			var scrollers = this._columnSetScrollers = {};
			var scrollerContents = this._columnSetScrollerContents = {};
			var scrollLefts = this._columnSetScrollLefts = {}; 
			for(var i = 0, l = columnSets.length; i < l; i++){
				(function(columnSet, i){
					var scroller = scrollers[i] = put(domNode, "div.dgrid-column-set-scroller[colsetid=" + i +"]");
					scrollerContents[i] = put(scroller, "div.dgrid-column-set-scroller-content");
					listen(scroller, "scroll", function(event){
						var scrollLeft = this.scrollLeft;
						scrollLefts[i] = scrollLeft;
						query('.dgrid-column-set[colsetid="' + i +'"]', domNode).forEach(function(element){
							element.scrollLeft = scrollLeft;
						});
					});
				})(columnSets[i], i);
			}
			var grid = this;
			positionScrollers(this, domNode);
			function reposition(){
				positionScrollers(grid, domNode);
			}
			listen(window, "resize", reposition);
			listen(domNode, "cellfocusin", function(event){
				adjustScrollLeft(grid, grid.row(event).element);
			});
			aspect.after(this, "styleColumn", reposition);		
		}
	});
	function positionScrollers(grid, domNode){
		var left = 0, scrollerWidth = 0;
		var scrollers = grid._columnSetScrollers;
		var scrollerContents = grid._columnSetScrollerContents;
		var columnSets = grid.columnSets;
		for(var i = 0, l = columnSets.length; i < l; i++){
			// iterate through the columnSets
			left += scrollerWidth;
			var columnSetElement = query('.dgrid-column-set[colsetid="' + i +'"]', domNode)[0];
			var scrollerWidth = columnSetElement.offsetWidth;
			var contentWidth = columnSetElement.firstChild.offsetWidth;
			scrollerContents[i].style.width = contentWidth + "px";
			scrollers[i].style.width = scrollerWidth + "px";
			scrollers[i].style.overflowX = contentWidth > scrollerWidth ? "scroll" : "auto"; // IE seems to need it be set explicitly
			scrollers[i].style.left = left + "px";
		}	
	}
	function adjustScrollLeft(grid, row){
		var scrollLefts = grid._columnSetScrollLefts;
		function doAdjustScrollLeft(){
			query(".dgrid-column-set", row).forEach(function(element){
				element.scrollLeft = scrollLefts[element.getAttribute('colsetid')];
			});
		}
		if(has("ie") < 8 || has("quirks")){
			setTimeout(doAdjustScrollLeft, 1);
		}else{
			doAdjustScrollLeft();
		}
	}
	
});