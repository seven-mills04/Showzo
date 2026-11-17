package com.showzo.catalogue;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "screens")
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Projection format of the screen: 2D, 3D or IMAX. */
    @Column(nullable = false, length = 10)
    private String format;

    /** Seat grid size. The seat map is built from these in the booking module. */
    @Column(nullable = false)
    private int totalRows;

    @Column(nullable = false)
    private int seatsPerRow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theatre_id")
    private Theatre theatre;

    protected Screen() {
    }

    public Screen(String name, String format, int totalRows, int seatsPerRow, Theatre theatre) {
        this.name = name;
        this.format = format;
        this.totalRows = totalRows;
        this.seatsPerRow = seatsPerRow;
        this.theatre = theatre;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getFormat() {
        return format;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public int getSeatsPerRow() {
        return seatsPerRow;
    }

    public Theatre getTheatre() {
        return theatre;
    }
}
