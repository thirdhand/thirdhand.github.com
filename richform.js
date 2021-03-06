/* Copyright (c) 2011 Reidar Djupvik
This software is MIT licensed; see http://www.opensource.org/licenses/mit-license.php */

(function($) {
	function changeMultiple(method, arg) {
		// Apply the same method and arg to multiple objects
		return function() {
			var args = arguments;
			if(!args.length) return false; // no args
			for(var i = 0; i < args.length; i++) {
				if(args[i] && args[i][method]) args[i][method](arg);
			}
			return true;
		};
	}
	var show = changeMultiple("removeClass", "jshidden");
	var hide = changeMultiple("addClass", "jshidden");
	function visible(el) {
		return (el ? !el.hasClass("jshidden") : null);
	}
	function MenuLabel(label) {
		// Object for manipulating menulabel
		label.click(function(e) {
			e.preventDefault();
		});
		var labeltext;
		function init() {
			labeltext = label.contents().get(0).nodeValue;
		}
		this.obj = label;
		this.addColon = function() {
			// Show colon in label when expanded
			init();
			if(labeltext.indexOf(":") == -1) {
				label.contents().get(0).nodeValue = $.trim(labeltext) + ":";
			}
		};
		this.removeColon = function() {
			// Remove colon in label when collapsed
			init();
			label.contents().get(0).nodeValue = labeltext.replace(":", "");
		};
		this.removeColon();
	}
	function RichSelect(el, opts) {
		// Object for rich menu functionality
		opts = opts || {};
		var settings = $.extend({
			imagePath : ""
		}, opts);
		var imgpath = settings.imagePath;
		var rs = this;
		function MenuBox(menubox) {
			// Add empty element for holding option text
			menubox.prepend("<span />");
			var menutext = menubox.children().first();
			var richopt = menubox.find(".richopt");
			hide(menubox, richopt);
			// Add remove button
			menubox.append($("<span />", {
				"class" : "removeval",
				tabindex : "0",
				click : function(e) {
					e.stopPropagation();
					rs.removeVal();
				}
			}));
			var removeval = menubox.children().last();
			removeval.html($("<img />", {
				src : imgpath + "remove.png",
				alt : "remove"
			}));
			removeval.jkey("enter, backspace, delete", function() {
				rs.removeVal();
			});
			this.update = function(option) {
				// Shows selected option. If option is a richopt show that element.
				rs.menulabel.addColon();
				if(option.hasClass("richopt")) {
					menutext.text("");
					show(richopt, menubox);
				}
				else {
					if(!richopt.hasClass("jshidden")) hide(richopt);
					menutext.text(option.text());
					show(menubox);
				}
				rs.menu.position();
			};
			this.visible = function() {
				return visible(menubox);
			};
			this.show = function() {
				rs.menulabel.addColon();
				show(menubox);
			};
			this.hide = function() {
				rs.menulabel.removeColon();
				hide(menubox);
			};
			this.reset = function() {
				this.hide();
				menutext.text("");
			};
			this.focus = function() {
				if(!visible(richopt)) return false;
				var inputs = richopt.find("input");
				// Select form element for added usability
				if(inputs.size()) {
					inputs.first().select();
				}
				return true;
			};
		}
		function Menu(menu) {
			var self = this;
			menu = (menu && menu.size()) ? menu : null; // Check for existence of menu
			this.name = menu ? menu.attr("name") : "";
			this.exists = function() {
				return menu ? true : false;
			};
			this.position = function() {
				// Set menu to show below button
				if(menu) menu.css("top", el.innerHeight() - 2);
			};
			this.visible = function() {
				return menu ? visible(menu) : rs.menubox.visible();
			};
			this.show = function() {
				if(menu) {
					show(menu);
					menu.focus();
				}
				else rs.menubox.show();
			};
			this.hide = function() {
				if(menu) {
					hide(menu);
					rs.menubox.focus();
				}
				else rs.menubox.hide();
			};
			this.update = function() {
				// Update selected menu option from valstore value
				if(!menu) return false;
				var option;
				var found = false;
				if(rs.valstore.exists()) {
					menu.children().each(function(i, el) {
						option = $(el);
						if(option.val() === rs.valstore.val()) {
							self.selected(option);
							found = true;
							return false;
						}
					});
				}
				else {
					option = this.selected();
					if(option) found = true;
				}
				if(found) {
					rs.menubox.update(option);
				}
				return found;
			};
			this.selected = function(o) {
				if(!menu) return null;
				if(o) {
					o.attr("selected", "selected");
					return o;
				}
				o = menu.children("option:selected");
				if(!o.size()) o = null;
				return o;
			};
			this.selectNext = function() {
				if(!menu) return null;
				var el = menu.get(0);
				if(!rs.menubox.visible()) {
					el.selectedIndex = 0;
				}
				else if(el.selectedIndex + 1 < menu.children().size()) {
					el.selectedIndex += 1;
				}
				rs.valstore.update();
				return el.selectedIndex;
			};
			this.selectPrev = function() {
				if(!menu) return null;
				var el = menu.get(0);
				if(el.selectedIndex === 0) {
					rs.removeVal();
				}
				else if(el.selectedIndex - 1 > -1) {
					el.selectedIndex -= 1;
					rs.valstore.update();
				}
				return el.selectedIndex;
			};
			this.reset = function() {
				if(!menu) return false;
				menu.get(0).selectedIndex = -1;
				hide(menu);
				this.position();
				return true;
			};
			this.val = function() {
				var val = "";
				var o = menu.selected();
				if(o) val = o.val();
				return val;
			};
			if(menu) {
				// Event handlers keep menu and valstore in sync
				menu.click(function(e) {
					rs.valstore.update();
					// The richselect click handler hides the menu
				});
				menu.change(function(e) {
					rs.valstore.update();
				});
				menu.jkey('enter', function() {
					rs.valstore.update();
					self.hide();
				});
				menu.jkey('esc', function() {
					self.hide();
					el.focus();
				});
				// Prevent key events from bubbling up to the richselect
				menu.keydown(function(e) {
					e.stopPropagation();
				});
				// Prevent pressing enter in the menu from submitting the form
				menu.keypress(function(e) {
					if(e.which == 13) e.preventDefault();
				});
				hide(menu);
				// Make into multiline select
				menu.attr("size", menu.children().size());
				this.position();
			}
		}
		function Valstore(valstore) {
			valstore = valstore.size() ? valstore : null; // Check for existence of valstore
			this.name = valstore ? valstore.attr("name") : "";
			this.exists = function() {
				return valstore ? true : false;
			};
			this.val = function(val) {
				if(valstore) {
					if(val) valstore.val(val);
					return valstore.val();
				}
				return "";
			};
			this.update = function() {
				// Update valstore from selected menu option
				var option = rs.menu.selected();
				if(option) {
					rs.menubox.update(option);
					if(valstore) valstore.val(option.val());
				}
				return valstore;
			};
			this.reset = function() {
				if(!valstore) return false;
				valstore.val("");
				return true;
			};
			if(valstore) {
				valstore.change(function() {
					rs.menu.update();
				});
			}
		}
		this.getVal = function() {
			var val;
			if(rs.valstore.exists()) {
				val = rs.valstore.val();
			}
			else {
				val = rs.menu.val();
			}
			return val;
		};
		this.setVal = function(val) {
			if(rs.valstore.exists()) {
				rs.valstore.val(val);
				rs.menu.update();
			}
		};
		this.removeVal = function() {
			// Call event and if it returns false cancel
			if(typeof opts.removeVal === "function") {
				if(opts.removeVal(rs) === false) return false;
			}
			// Remove value and collapse menu button to initial form
			rs.menubox.reset();
			rs.valstore.reset();
			rs.menu.reset();
			return true;
		};
		this.menulabel = new MenuLabel(el.find(".showmenu"));
		this.menubox = new MenuBox(el.find(".menubox"));
		this.menu = new Menu(el.find(".menu"));
		this.valstore = new Valstore(el.find(".valstore"));
		this.menu.update();
		this.name = (this.valstore.exists() ? this.valstore.name : this.menu.name);
		// Make text unselectable in IE and Opera
		if(typeof el.get(0).unselectable !== "undefined") {
			el.get(0).unselectable = "on";
			el.find("*").each(function(i, el) {
				if(!$(el).is("input, select, textarea")) el.unselectable = "on";
			});
		}
		// Add dropdown image
		if(this.menu.exists()) {
			el.append($("<img />", {
				src : imgpath + "dropdown.png",
				alt : "dropdown"
			}));
		}
		// Event handlers for menu button
		el.click(function(e) {
			e.stopPropagation(); // Don't let the document close the menu again
			var target = $(e.target);
			if(target.is(".menubox label") || target.is("input")) {
				return;
			}
			if(rs.menu.visible())
				rs.menu.hide();
			else
				rs.menu.show();
		});
		// Get tabindex for keyboard navigation
		if(!el.attr("tabindex")) el.attr("tabindex", "0");
		el.jkey('down', function() {
			rs.menu.selectNext();
			var opt = rs.menu.selected();
			(opt && opt.hasClass("richopt")) ? rs.menubox.focus() : el.focus();
		});
		el.jkey('up', function() {
			rs.menu.selectPrev();
			var opt = rs.menu.selected();
			(opt && opt.hasClass("richopt")) ? rs.menubox.focus() : el.focus();
		});
	}
	// Array holding all rich menus
	var selects = [];
	$(function() {
		// Close any open menu
		$(document).click(function() {
			for(var i = 0; i < selects.length; i++) {
				if(selects[i].menu.visible()) selects[i].menu.hide();
			}
		});
	});
	// jQuery plugin
	$.richselect = $.richselect || function(selector, opts, callback) {
		opts = opts || {};
		var a = [];
		$(selector).each(function(i, el) {
			var select = new RichSelect($(el), opts);
			a[a.length] = select;
			selects[selects.length] = select;
			if(typeof callback === "function") callback(select);
		});
		return a;
	};
	$.richselect.selects = $.richselect.selects || selects;
})(jQuery);